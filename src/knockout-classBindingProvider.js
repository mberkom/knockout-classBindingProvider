!(function(factory) {
    //AMD
    if (typeof define === "function" && define.amd) {
        define(["knockout", "exports"], factory);
        //normal script tag
    } else {
        factory(ko);
    }
}(function(ko, exports, undefined) {
    //a bindingProvider that uses something different than data-bind attributes
    //  bindings - an object that contains the binding classes
    //  options - is an object that can include "attribute", "virtualAttribute", and "fallback" options
    var classBindingsProvider = function(bindings, options) {
        var existingProvider = new ko.bindingProvider();

        options = options || {};

        //override the attribute
        this.attribute = options.attribute || "data-class";
        
        //override the virtual attribute
        this.virtualAttribute = "ko " + (options.virtualAttribute || "class") + ":";

        //fallback to the existing binding provider, if bindings are not found
        this.fallback = options.fallback;

        //this object holds the binding classes
        this.bindings = bindings || {};
        
        //this object holds a list of binding keys
        this.registeredBindingKeys = [];
        
        // check if bindings are already registered
        this.bindingIsRegistered = function(bindingKey) {
	        return this.registeredBindingKeys.indexOf(bindingKey) > -1;
        };
        
        //allow bindings to be registered after instantiation, you can optionally pass a bindingKey for later reference
        this.registerBindings = function(newBindings, bindingKey) {
	        if(bindingKey) {
	        	if(this.bindingIsRegistered(bindingKey)) {
		        	return false; // bindings already registered
	        	}
	        
	        	this.registeredBindingKeys.push(bindingKey);
	        }
	        
	        ko.utils.extend(this.bindings, newBindings);
	        
	        return true;
        };

        //determine if an element has any bindings
        this.nodeHasBindings = function(node) {
            var result, value;

            if (node.nodeType === 1) {
                result = node.getAttribute(this.attribute);
            }
            else if (node.nodeType === 8) {
                value = "" + node.nodeValue || node.text;
                result = value.indexOf(this.virtualAttribute) > -1;
            }

            if (!result && this.fallback) {
                result = existingProvider.nodeHasBindings(node);
            }

            return result;
        };

        //return the bindings given a node and the bindingContext
        this.getBindings = function(node, bindingContext) {
            var i, j, bindingAccessor, binding,
                result = {},
                value, index,
                classes = "";

            if (node.nodeType === 1) {
                classes = node.getAttribute(this.attribute);
            }
            else if (node.nodeType === 8) {
                value = "" + node.nodeValue || node.text;
                index = value.indexOf(this.virtualAttribute);

                if (index > -1) {
                    classes = value.substring(index + this.virtualAttribute.length);
                }
            }

            if (classes) {
                classes = classes.replace(/^(\s|\u00A0)+|(\s|\u00A0)+$/g, "").replace(/(\s|\u00A0){2,}/g, " ").split(' ');
                //evaluate each class, build a single object to return
                for (i = 0, j = classes.length; i < j; i++) {
                    bindingAccessor = this.bindings[classes[i]];
                    if (bindingAccessor) {
                        binding = typeof bindingAccessor == "function" ? bindingAccessor.call(bindingContext.$data, bindingContext, classes) : bindingAccessor;
                        ko.utils.extend(result, binding);
                    }
                }
            }
            else if (this.fallback) {
                result = existingProvider.getBindings(node,bindingContext);
            }

            return result;
        };
    };

    if (!exports) {
        ko.classBindingProvider = classBindingsProvider;
    }

    return classBindingsProvider;
}));